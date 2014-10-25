require 'csv'
require 'json'

class OutbreakData
	attr_accessor :all_data, :case_data, :death_data, :affected_countries, :dates

	def initialize
		@all_data = []
		@case_data = []
		@death_data = []
		@dates = {}

		CSV.foreach('ebola_outbreak_data.csv') do |row|
			all_data << row
		end

		generate_headers
	end

	def date(row)
		data = row[0].split('/')
		"#{data[2]}-#{data[0].rjust(2,'0')}-#{data[1].rjust(2,'0')}"
	end

	def generate_headers
		@headers = @all_data[0]
	end

	def generate_dates
		@dates = all_data.inject({}) do |memo, row| 
			next memo if row[0] == 'Date'
			date = date(row)
			memo[date] = date 
			memo
		end
	end

	def data_for(row)
		data = []
		row.each_with_index do |field, index|
			next if index == 0
			cases, deaths = field.split('/')
			country = @headers[index];
			data << { code: @country_mapping[country], cases: cases, deaths: deaths } if cases.to_i > 0
		end

		data
	end

	def write_outbreak_json(country_mapping)
		@country_mapping = country_mapping

		outbreak_data = @all_data.each_with_index.inject({}) do |memo, (row, index)|
			next memo if index == 0
			memo[date(row)] = data_for(row)
			memo
		end

		File.open("outbreak_data.json","w") do |f|
  			f.write(outbreak_data.to_json)
		end		
	end
end
