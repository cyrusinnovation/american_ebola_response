require 'csv'
require 'date'
require_relative 'country_data'
require_relative 'outbreak_data'

class EbolaData
	attr_accessor :countries, :sorted_names

	def initialize()
		@countries = {}
		@dates = {}
	end

	def dates
		@dates.keys.sort
	end

	def dates_hash(dates_array)
		dates_array.inject({}) { |memo, date| memo[date] = true; memo }
	end

	def add_country(country_data)
		if (@dates.empty?)
			@dates = dates_hash(country_data.dates)
		else
			@dates.merge!(dates_hash(country_data.dates))
		end
		raise "bad data for #{country_data.name}" if dates.include? nil

		merge_in_country_data(country_data)
	end

	def merge_in_country_data(country_data)
		if (@countries.has_key?(country_data.name))
			@countries[country_data.name].merge_data(country_data)
		else
			@countries[country_data.name] = country_data
		end
	end

	def line(date)
		[date] + @sorted_countries.map { |country_name| countries[country_name].data_for(date) }
	end

	def header
		['Date'] + @sorted_countries
	end

	def normalize_data
		@countries.values.each { |country_data| country_data.normalize_data }
	end

	def write_csv(outbreak_data)
		# @countries['430'].data.each_with_index do |data, index|
		# 	puts "#{@countries['430'].dates[index]}: #{index} #{data}"
		# end
		# @countries['328'].data.each_with_index do |data, index|
		# 	puts "#{@countries['328'].dates[index]}: #{index} #{data}"
		# end

		@sorted_countries = countries.keys.sort
		CSV.open("outputs/ebola_results.csv", 'w') do |writer|
			writer << header
			outbreak_data.dates.each do |date|
				writer << line(date)
			end
		end
	end
end
