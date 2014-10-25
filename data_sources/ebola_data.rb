require 'csv'
require 'date'
require_relative 'country_data'
require_relative 'outbreak_data'

class BorderingData
	attr_accessor :after, :exact

	def initialize(all_dates, specific_date)
		# Find data lines before and after the date
		@after = all_dates.index { |date| date >= specific_date }
		raise "BorderingDate: date #{date} is out of bounds" unless after
		@exact = @after if @after == specific_date
		raise "BorderingDate: date #{date} is out of bounds" if (after < 1)
	end

	def interpolate(date, ebola_data)
		return [date] + ebola_data.line(exact) if exact
		prior_date = ebola_data.dates[after - 1]
		after_date = ebola_data.dates[after]
		s = interpolant(date, prior_date, after_date)

		line1 = ebola_data.line(after - 1)
		line2 = ebola_data.line(after)
		[date] + line1.zip(line2).map { |first_field, second_field| linear_interpolate(first_field, second_field, s) }
	end

	private

	def interpolant(date, prior, after)
		d = Date.parse(date, '%y-%m-%d')
		p = Date.parse(prior, '%y-%m-%d')
		a = Date.parse(after, '%y-%m-%d')

		interp = 1.0 - (a - d).to_f / (a - p).to_f
		raise 'bad' if (interp < 0.0 || interp > 1.0)
		interp
	end

	# linear interpolate between x and y
	def linear_interpolate(x, y, s)
		x + (y - x) * s
	end
end

class EbolaData
	attr_accessor :countries, :dates, :sorted_names

	def initialize()
		@countries = {}
		@dates = []
	end

	def add_country(country_data)
		if (@dates.empty?)
			@dates = country_data.dates
		else
			raise 'dates mismatch' unless (dates == country_data.dates)
		end

		@countries[country_data.name] = country_data
	end

	def line(index)
		@sorted_countries.map { |country_name| countries[country_name].data[index] }
	end

	def header
		['Date'] + @sorted_countries
	end

	def write_csv(outbreak_data)
		@sorted_countries = countries.keys.sort
		CSV.open("ebola_results.csv", 'w') do |writer|
			writer << header
			outbreak_data.dates.keys.each_with_index do |date, index|
				writer << BorderingData.new(@dates, date).interpolate(date, self)
			end
		end
	end
end
